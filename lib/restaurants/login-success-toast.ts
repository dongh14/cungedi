export const LOGIN_SUCCESS_SIGNAL = "1";
export const LOGIN_SUCCESS_TOAST_DURATION_MS = 2500;

export function consumeLoginSuccessSignal(search: string) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  if (params.get("login_success") !== LOGIN_SUCCESS_SIGNAL) {
    return {
      shouldShow: false,
      cleanedSearch: search,
    };
  }

  params.delete("login_success");
  const nextSearch = params.toString();

  return {
    shouldShow: true,
    cleanedSearch: nextSearch ? `?${nextSearch}` : "",
  };
}
