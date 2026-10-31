import type { CSSProperties } from "react";

/** Inline-стиль с CSS-переменными (`--i`, `--n`, `--d` и т. п.), которые читают модули блоков. */
export type Vars = CSSProperties & Record<`--${string}`, string | number>;
