const elapsedStreamTime = (startTime: string) => {
  const currentDate = new Date();
  const startDate = new Date(startTime);

  // Calculate the difference in milliseconds
  const differenceMs = currentDate.getTime() - startDate.getTime();

  // Calculate hours, minutes, and seconds
  const hours = Math.floor(differenceMs / (1000 * 60 * 60));
  const minutes = Math.floor((differenceMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((differenceMs % (1000 * 60)) / 1000);

  if (!hours) {
    return `${minutes}m`;
  }

  if (!minutes) {
    return `${seconds}s`;
  }

  return `${hours}h`;
};
export default elapsedStreamTime;
