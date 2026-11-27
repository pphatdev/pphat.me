import { NextRequest } from 'next/server';
import { guardWrite, readJson } from '../../lib/guard';
import { signInResponse } from '../../lib/sign-in';

/**
 * Finish GitHub/Google sign-in: /auth/callback posts the tokens from the URL
 * fragment here; they are verified with the API and moved into HttpOnly cookies.
 */
export async function POST(request: NextRequest) {
    const blocked = guardWrite(request);
    if (blocked) return blocked;
    return signInResponse(await readJson<{ accessToken?: string; refreshToken?: string }>(request));
}
