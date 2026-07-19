export function getSafeLoginErrorMessage(error?: string) {
  if (!error) {
    return undefined;
  }

  if (error === "请输入邮箱和密码。") {
    return error;
  }

  return "邮箱或密码错误，请检查后重试。";
}

export function getSafeSignUpErrorMessage(error?: string) {
  if (!error) {
    return undefined;
  }

  if (error === "请输入邮箱和密码。" || error === "密码至少需要 6 位字符。") {
    return error;
  }

  return "注册失败，请检查信息后重试。";
}
