import type {
  AuthSession,
  Outfit,
  OutfitWear,
  Page,
  StyleProfile,
  UserProfile,
  WardrobeItem,
} from '@klotho/shared';
import request from 'supertest';

import { createTestApp, type TestApp } from './utils/test-app';

/** US9.1: the whole beta journey, from sign-up to account deletion. */
describe('Beta journey (e2e)', () => {
  let t: TestApp;
  const http = () => request(t.app.getHttpServer());

  /** Reproducible test wardrobe: 10 pieces, enough for several looks. */
  const PIECES = [
    { category: 'TOP', name: 'Blouse ecru', primaryColor: 'ecru' },
    { category: 'TOP', name: 'T-shirt blanc', primaryColor: 'white' },
    { category: 'TOP', name: 'Pull camel', primaryColor: 'camel' },
    { category: 'BOTTOM', name: 'Jean', primaryColor: 'denim' },
    { category: 'BOTTOM', name: 'Jupe midi', primaryColor: 'black' },
    { category: 'BOTTOM', name: 'Pantalon', primaryColor: 'navy' },
    { category: 'DRESS', name: 'Robe fleurie', primaryColor: 'powderPink' },
    { category: 'SHOES', name: 'Baskets', primaryColor: 'white' },
    { category: 'SHOES', name: 'Ballerines', primaryColor: 'black' },
    { category: 'LAYER', name: 'Blazer', primaryColor: 'navy' },
  ];

  beforeAll(async () => {
    t = await createTestApp();
    await t.reset();
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('sign-up → profile → 10 pieces → looks → favourite → opinion → worn → history → deletion', async () => {
    // 1. Sign-up.
    const session = (
      await http()
        .post('/auth/register')
        .send({
          email: 'beta@example.com',
          password: 'Dressing2026!',
          firstName: 'Bêta',
        })
        .expect(201)
    ).body as AuthSession;
    const auth = { Authorization: `Bearer ${session.tokens.accessToken}` };
    const me = (await http().get('/users/me').set(auth).expect(200))
      .body as UserProfile;
    expect(me.email).toBe('beta@example.com');

    // 2. Style profile: the onboarding.
    const empty = (await http().get('/preferences/me').set(auth).expect(200))
      .body as StyleProfile;
    expect(empty.onboardingCompleted).toBe(false);
    const profile = (
      await http()
        .put('/preferences/me')
        .set(auth)
        .send({
          preferredStyles: ['casual', 'chic'],
          preferredColors: ['ecru', 'navy'],
          avoidedColors: ['orange'],
          acceptsHeels: false,
        })
        .expect(200)
    ).body as StyleProfile;
    expect(profile.onboardingCompleted).toBe(true);

    // 3. Ten pieces.
    const pieces: WardrobeItem[] = [];
    for (const piece of PIECES) {
      pieces.push(
        (await http().post('/wardrobe').set(auth).send(piece).expect(201))
          .body as WardrobeItem,
      );
    }
    const wardrobe = (await http().get('/wardrobe').set(auth).expect(200))
      .body as Page<WardrobeItem>;
    expect(wardrobe.total).toBe(10);

    // 4. Looks of the day.
    const looks = (
      await http()
        .post('/outfits/generate')
        .set(auth)
        .send({ temperature: 18 })
        .expect(201)
    ).body as Outfit[];
    expect(looks.length).toBeGreaterThanOrEqual(2);
    const [chosen, disliked] = looks as [Outfit, Outfit];
    const ownIds = new Set(pieces.map((piece) => piece.id));
    for (const look of looks) {
      expect(look.pieces.every((p) => ownIds.has(p.item.id))).toBe(true);
    }

    // 5. Favourite.
    const favourite = (
      await http().post(`/outfits/${chosen.id}/favorite`).set(auth).expect(200)
    ).body as Outfit;
    expect(favourite.isFavorite).toBe(true);
    const favourites = (
      await http().get('/outfits?filter=favorites').set(auth).expect(200)
    ).body as Page<Outfit>;
    expect(favourites.items.map((look) => look.id)).toEqual([chosen.id]);

    // 6. Opinions.
    const liked = (
      await http()
        .post(`/outfits/${chosen.id}/feedback`)
        .set(auth)
        .send({ rating: 'like' })
        .expect(200)
    ).body as Outfit;
    expect(liked.feedback?.rating).toBe('like');
    await http()
      .post(`/outfits/${disliked.id}/feedback`)
      .set(auth)
      .send({ rating: 'dislike', reasons: ['colors'] })
      .expect(200);

    // 7. Worn today.
    const wear = (
      await http()
        .post(`/outfits/${chosen.id}/wear`)
        .set(auth)
        .send({ wornOn: '2026-10-01' })
        .expect(200)
    ).body as OutfitWear;
    expect(wear).toMatchObject({ wornOn: '2026-10-01' });

    // 8. History.
    const history = (await http().get('/outfits/history').set(auth).expect(200))
      .body as Page<OutfitWear>;
    expect(history.total).toBe(1);
    expect(history.items[0]).toMatchObject({
      id: wear.id,
      wornOn: '2026-10-01',
      outfit: { id: chosen.id, lastWornOn: '2026-10-01', isFavorite: true },
    });
    const worn = (
      await http().get('/outfits?filter=worn').set(auth).expect(200)
    ).body as Page<Outfit>;
    expect(worn.items.map((look) => look.id)).toEqual([chosen.id]);

    // 9. Wardrobe counters.
    const wornIds = chosen.pieces.map((piece) => piece.item.id);
    for (const piece of pieces) {
      const item = (
        await http().get(`/wardrobe/${piece.id}`).set(auth).expect(200)
      ).body as WardrobeItem;
      const isWorn = wornIds.includes(piece.id);
      expect({ id: item.id, wearCount: item.wearCount }).toEqual({
        id: piece.id,
        wearCount: isWorn ? 1 : 0,
      });
      expect(item.lastWornAt === null).toBe(!isWorn);
    }
    const mostWorn = (
      await http().get('/wardrobe?sort=mostWorn').set(auth).expect(200)
    ).body as Page<WardrobeItem>;
    expect(wornIds).toContain(mostWorn.items[0]?.id);

    // 10. Account deletion.
    await http()
      .delete('/users/me')
      .set(auth)
      .send({ password: 'Dressing2026!' })
      .expect(204);
    await http()
      .post('/auth/login')
      .send({ email: 'beta@example.com', password: 'Dressing2026!' })
      .expect(401);
    expect(await t.prisma.outfit.count()).toBe(0);
    expect(await t.prisma.wardrobeItem.count()).toBe(0);
  });
});
