import { nanoid } from '@reduxjs/toolkit';
import { MessageType, MessageTypeNotice } from '../services/types/messages';

const createCustomNotice = (
  channelName: string,
  body: string,
): MessageTypeNotice => ({
  type: MessageType.NOTICE,
  id: nanoid(),
  channelName,
  body,
  noticeType: '',
});

export default createCustomNotice;
