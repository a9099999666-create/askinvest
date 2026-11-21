import { revalidateTag } from "next/cache";

export function revalidatePublic() {
  try {
    revalidateTag("public-site");
  } catch {
    // CLI seeds run outside the Next.js runtime.
  }
}
