const truncate = (str: string, num: number) => {
  if (str.length > num) {
    return `${str.slice(0, num)}...`;
  }
  return str;
};
export default truncate;
