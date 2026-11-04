import type { HTMLAttributes, Ref } from "react";

export type SurfaceMaterial = "solid" | "frosted" | "liquid";

export interface GlassSurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article" | "aside";
  material?: SurfaceMaterial;
  ref?: Ref<HTMLElement>;
}

/** Solid by default; the material changes presentation only. */
export function GlassSurface({
  as: Element = "div",
  material = "solid",
  className = "",
  ref,
  ...props
}: GlassSurfaceProps) {
  return (
    <Element
      className={`vy-material ${className}`}
      data-material={material}
      ref={
        ref
          ? (node: HTMLElement | null) => {
              if (typeof ref === "function") return ref(node);
              ref.current = node;
            }
          : undefined
      }
      {...props}
    />
  );
}
