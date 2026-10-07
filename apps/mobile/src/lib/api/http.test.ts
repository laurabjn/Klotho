import { ApiError, NetworkError, errorMessageKey } from './errors';
import { registerAuthHooks, request } from './http';
import { SLOW_ANSWER_MS, useServerWake } from './server-wake';

function jsonResponse(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('request', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
    registerAuthHooks(null);
  });

  it('sends JSON and parses the response', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));

    await expect(
      request('/x', { method: 'POST', body: { a: 1 } }),
    ).resolves.toEqual({ ok: true });
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe('{"a":1}');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('turns an error body into an ApiError', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(409, { statusCode: 409, code: 'auth.emailAlreadyUsed' }),
    );

    const error = await request('/x').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, code: 'auth.emailAlreadyUsed' });
  });

  it('turns a fetch failure into a NetworkError', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    await expect(request('/x')).rejects.toBeInstanceOf(NetworkError);
  });

  it('sends the access token on authenticated requests only', async () => {
    registerAuthHooks({
      getAccessToken: () => 'token-1',
      refreshAccessToken: jest.fn(),
    });
    fetchMock.mockResolvedValue(jsonResponse(200, {}));

    await request('/public');
    await request('/private', { auth: true });

    const headers = fetchMock.mock.calls.map(
      ([, init]) => (init as RequestInit).headers,
    );
    expect(headers[0]).not.toHaveProperty('Authorization');
    expect(headers[1]).toMatchObject({ Authorization: 'Bearer token-1' });
  });

  it('refreshes once and replays the request after a 401', async () => {
    const refreshAccessToken = jest.fn().mockResolvedValue('token-2');
    registerAuthHooks({ getAccessToken: () => 'token-1', refreshAccessToken });
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse(401, { statusCode: 401, code: 'auth.unauthorized' }),
      )
      .mockResolvedValueOnce(jsonResponse(200, { id: 'me' }));

    await expect(request('/users/me', { auth: true })).resolves.toEqual({
      id: 'me',
    });
    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(
      (fetchMock.mock.calls[1] as [string, RequestInit])[1].headers,
    ).toMatchObject({
      Authorization: 'Bearer token-2',
    });
  });

  it('gives up when the session cannot be refreshed', async () => {
    registerAuthHooks({
      getAccessToken: () => 'old',
      refreshAccessToken: () => Promise.resolve(null),
    });
    fetchMock.mockResolvedValue(
      jsonResponse(401, { statusCode: 401, code: 'auth.unauthorized' }),
    );

    await expect(request('/users/me', { auth: true })).rejects.toMatchObject({
      status: 401,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('errorMessageKey', () => {
  it.each([
    [new NetworkError(), 'apiErrors.network'],
    [
      new ApiError(401, 'auth.invalidCredentials'),
      'apiErrors.auth.invalidCredentials',
    ],
    [new ApiError(500, 'server.error'), 'apiErrors.unknown'],
    [new Error('boom'), 'apiErrors.unknown'],
  ])('maps %p to %s', (error, key) => {
    expect(errorMessageKey(error)).toBe(key);
  });
});

describe('request while the server wakes up', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    globalThis.fetch = fetchMock;
    registerAuthHooks(null);
  });

  afterEach(() => {
    jest.useRealTimers();
    useServerWake.setState({ slowRequests: 0 });
  });

  it('announces a slow answer, then forgets it', async () => {
    jest.useFakeTimers();
    let answer: (r: Response) => void = () => undefined;
    fetchMock.mockReturnValue(
      new Promise<Response>((resolve) => {
        answer = resolve;
      }),
    );

    const pending = request('/x');
    jest.advanceTimersByTime(SLOW_ANSWER_MS - 1);
    expect(useServerWake.getState().slowRequests).toBe(0);
    jest.advanceTimersByTime(1);
    expect(useServerWake.getState().slowRequests).toBe(1);

    answer(jsonResponse(200, { ok: true }));
    await expect(pending).resolves.toEqual({ ok: true });
    expect(useServerWake.getState().slowRequests).toBe(0);
  });

  it('waits up to 90 seconds before giving up', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () =>
            reject(new Error('aborted')),
          );
        }),
    );

    const pending = request('/x').catch((e: unknown) => e);
    jest.advanceTimersByTime(89_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1_000);

    expect(await pending).toBeInstanceOf(NetworkError);
    expect(useServerWake.getState().slowRequests).toBe(0);
  });

  it('never announces a photo upload, which shows its own progress', async () => {
    jest.useFakeTimers();
    fetchMock.mockReturnValue(new Promise(() => undefined));

    void request('/upload', { method: 'POST', form: new FormData() });
    jest.advanceTimersByTime(SLOW_ANSWER_MS * 2);

    expect(useServerWake.getState().slowRequests).toBe(0);
  });
});
