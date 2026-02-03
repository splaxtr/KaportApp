import { SignJWT, jwtVerify } from "jose";

const DEFAULT_JWT_SECRET = "CHANGE_THIS_SECRET_IN_PRODUCTION_MIN_32_CHARS!";

function getJwtSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!raw || raw === DEFAULT_JWT_SECRET) {
      throw new Error("JWT_SECRET must be set to a secure value in production.");
    }
  }
  return new TextEncoder().encode(raw || DEFAULT_JWT_SECRET);
}

const JWT_SECRET = getJwtSecret();
const REVIEW_AUD = "review";
const REVIEW_ISS = "kaportapp";
const REVIEW_EXPIRY = "15m";

export type ReviewSessionPayload = {
  reviewTokenId: number;
  vehicleFileId: number;
};

export async function createReviewSessionToken(payload: ReviewSessionPayload): Promise<string> {
  return new SignJWT({
    rtid: payload.reviewTokenId,
    vfid: payload.vehicleFileId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REVIEW_EXPIRY)
    .setAudience(REVIEW_AUD)
    .setIssuer(REVIEW_ISS)
    .sign(JWT_SECRET);
}

export async function verifyReviewSessionToken(token: string): Promise<ReviewSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      audience: REVIEW_AUD,
      issuer: REVIEW_ISS,
    });
    const reviewTokenId = Number(payload.rtid);
    const vehicleFileId = Number(payload.vfid);
    if (!Number.isInteger(reviewTokenId) || !Number.isInteger(vehicleFileId)) return null;
    return { reviewTokenId, vehicleFileId };
  } catch {
    return null;
  }
}
