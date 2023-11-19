import AsyncStorage from '@react-native-async-storage/async-storage';

const getTokens = async () => {
  const [anonToken, token] = await Promise.all([
    await AsyncStorage.getItem('anonToken'),
    await AsyncStorage.getItem('token'),
  ]);
  return {
    anonToken,
    token,
  };
};
export default getTokens;
