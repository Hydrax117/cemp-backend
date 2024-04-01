const validatePassword = (password) => {
  const minLength = 8; // Adjust as needed
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*()]/.test(password);

  return (
    password.length >= minLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSymbol
  );
}

const validEmail = (email) => {
  const emailRegex = /\S+@\S+\.\S+/;
  if (!email || email.trim().length === 0 || !emailRegex.test(email)) return
}

export { validatePassword, validEmail};