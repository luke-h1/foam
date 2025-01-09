// /* eslint-disable no-shadow */
// import Chat from '@app/components/Chat';
// import EmptyState from '@app/components/ui/EmptyState';
// import Spinner from '@app/components/ui/Spinner';
// import { Text } from '@app/components/ui/Text';
// import { StreamStackScreenProps } from '@app/navigators/StreamStackNavigator';
// import twitchQueries from '@app/queries/twitchQueries';
// import { colors } from '@app/styles';
// import { useQueries } from '@tanstack/react-query';
// import { FC } from 'react';
// import {
//   View,
//   SafeAreaView,
//   Dimensions,
//   ScrollView,
//   Image,
//   ViewStyle,
//   TextStyle,
//   ImageStyle,
// } from 'react-native';
// import WebView from 'react-native-webview';

// const LiveStreamScreen: FC<StreamStackScreenProps<'LiveStream'>> = ({
//   route: { params },
// }) => {
//   const [streamQueryResult, userQueryResult, userProfilePictureQueryResult] =
//     useQueries({
//       queries: [
//         twitchQueries.getStream(params.id),
//         twitchQueries.getUser(params.id),
//         twitchQueries.getUserImage(params.id),
//       ],
//     });

//   const {
//     data: stream,
//     isLoading: isStreamLoading,
//     refetch: refetchStream,
//   } = streamQueryResult;
//   const {
//     data: user,
//     isLoading: isUserLoading,
//     refetch: refetchUser,
//   } = userQueryResult;
//   const {
//     data: userProfilePicture,
//     isLoading: isUserProfilePictureLoading,
//     refetch: refetchUserProfilePicture,
//   } = userProfilePictureQueryResult;

//   const { width } = Dimensions.get('window');

//   if (isStreamLoading || isUserLoading || isUserProfilePictureLoading) {
//     return <Spinner />;
//   }

//   const handleRefresh = async () => {
//     await Promise.all([
//       refetchStream(),
//       refetchUser(),
//       refetchUserProfilePicture(),
//     ]);
//   };

//   if (!stream) {
//     return (
//       <EmptyState
//         content="Failed to fetch stream."
//         heading="No Stream found"
//         buttonOnPress={() => handleRefresh()}
//       />
//     );
//   }

//   return (
//     <SafeAreaView style={$container}>
//       <ScrollView contentContainerStyle={$scrollViewContent}>
//         <WebView
//           source={{
//             uri: `https://player.twitch.tv?channel=${stream?.user_login}&controls=true&parent=localhost&autoplay=true`,
//           }}
//           style={[
//             $webView,
//             {
//               width, // Adjust width based on screen size
//               height: width * (9 / 16), // Maintain 16:9 aspect ratio
//             },
//           ]}
//           allowsInlineMediaPlayback
//         />
//         <View style={$videoDetails}>
//           <View style={$videoTitleContainer}>
//             <Text style={$videoTitle}>{stream?.title}</Text>
//           </View>
//           <View style={$videoMetadata}>
//             <View style={$userInfo}>
//               <Image source={{ uri: userProfilePicture }} style={$avatar} />
//               <Text style={$videoUser}>{user?.display_name}</Text>
//             </View>
//             <Text style={$videoViews}>
//               {new Intl.NumberFormat('en-US').format(
//                 stream?.viewer_count as number,
//               )}{' '}
//               viewers
//             </Text>
//           </View>
//         </View>
//         <View style={$chatContainer}>
//           <Chat
//             channelId={user?.id as string}
//             channelName={stream?.user_login as string}
//           />
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// };
// export default LiveStreamScreen;

// const $container: ViewStyle = {
//   flex: 1,
//   backgroundColor: colors.background,
// };

// const $scrollViewContent: ViewStyle = {
//   alignItems: 'center',
// };

// const $webView: ViewStyle = {
//   overflow: 'hidden',
// };

// const $videoDetails: ViewStyle = {
//   padding: 10,
//   width: '100%',
// };

// const $videoTitleContainer: ViewStyle = {
//   marginBottom: 10,
// };

// const $videoTitle: TextStyle = {
//   fontSize: 18,
//   fontWeight: 'bold',
//   color: colors.text,
// };

// const $videoMetadata: ViewStyle = {
//   flexDirection: 'row',
//   justifyContent: 'space-between',
//   alignItems: 'center',
//   marginBottom: 10,
// };

// const $userInfo: ViewStyle = {
//   flexDirection: 'row',
//   alignItems: 'center',
// };

// const $avatar: ImageStyle = {
//   width: 40,
//   height: 40,
//   borderRadius: 20,
//   marginRight: 10,
// };

// const $videoUser: TextStyle = {
//   fontSize: 16,
//   fontWeight: 'bold',
// };

// const $videoViews: TextStyle = {
//   fontSize: 16,
//   color: colors.textDim,
// };

// const $chatContainer: ViewStyle = {
//   padding: 2,
//   maxHeight: 300, // Restrict the height of the chat container
// };
