"use client";

import { useFormStatus } from "react-dom";

type AuthSubmitButtonProps = {
  label: string;
  pendingLabel: string;
};

export function AuthSubmitButton({ label, pendingLabel }: AuthSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" className="primary-button auth-submit-button w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </button>
  );
}
