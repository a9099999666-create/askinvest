import { revalidateTag } from "next/cache";

export function revalidatePublic() {
  revalidateTag("public-site");
}
