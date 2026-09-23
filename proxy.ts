import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { publicCases } from "@/lib/portfolio";

const publicWorkSlugs = new Set(["atelier-in-motion", ...publicCases.map(({ slug }) => slug)]);

export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.split("/").filter(Boolean)[1];
  if (!slug || publicWorkSlugs.has(slug)) return NextResponse.next();
  const notFoundURL = request.nextUrl.clone();
  notFoundURL.pathname = "/__work-not-found";
  return NextResponse.rewrite(notFoundURL);
}

export const config = { matcher: "/works/:slug" };
