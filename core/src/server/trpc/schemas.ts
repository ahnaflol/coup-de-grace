import { z } from "zod";

export const planContentSchema = z.object({
  title: z.string(),
  tasks: z.array(
    z.object({
      title: z.string(),
      instruction: z.string(),
    })
  ),
});
