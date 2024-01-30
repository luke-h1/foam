const clearElementById = (id: string) => {
  const container = document.getElementById(id);
  if (container) {
    container.innerHTML = '';
  }
};

export default clearElementById;
