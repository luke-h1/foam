export const checkUsernameMention = (
  message: string,
  username: string,
): boolean => {
  const regex = new RegExp(`@${username}`, 'i');
  return regex.test(message);
};
