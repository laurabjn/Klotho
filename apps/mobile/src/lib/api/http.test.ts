import { ApiError, NetworkError, errorMessageKey } from './errors';
import { registerAuthHooks, request } from './http';

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
