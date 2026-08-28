"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

type Props = {
  children: React.ReactNode;
};

/** Evita fixed preso ao transform do layout (logo sobre modal). */
export function ModalPortal({ children }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}
