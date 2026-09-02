export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

export const getInitials = (name) => {
  if (!name || typeof name !== "string") return "U";

  const words = name.trim().split(/\s+/);
  let initials = "";

  for (let i = 0; i < Math.min(words.length, 2); i++) {
    if (words[i][0]) initials += words[i][0];
  }

  return initials.toUpperCase() || "U";
};