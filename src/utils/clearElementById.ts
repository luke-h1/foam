export const clearElementById = (id: string) => {
  // eslint-disable-next-line no-undef
  const container = document.getElementById(id);
  if (container) {
    container.innerHTML = '';
  }
};
