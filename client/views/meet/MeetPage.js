import { Button, Box, Icon, Flex } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import React, { useEffect, useState, useCallback } from 'react';

import { APIClient } from '../../../app/utils/client';
import UserAvatar from '../../components/avatar/UserAvatar';
import { useRouteParameter, useQueryStringParameter } from '../../contexts/RouterContext';
import NotFoundPage from '../notFound/NotFoundPage';
import PageLoading from '../root/PageLoading';
import CallPage from './CallPage';

function MeetPage() {
	const [isRoomMember, setIsRoomMember] = useState(false);
	const [status, setStatus] = useState(null);
	const [visitorId, setVisitorId] = useState(null);
	const [visitorName, setVisitorName] = useState('');
	const [agentName, setAgentName] = useState('');
	const roomId = useRouteParameter('rid');
	const visitorToken = useQueryStringParameter('token');

	const setupCallForVisitor = useCallback(async () => {
		const room = await APIClient.v1.get(`/livechat/room?token=${visitorToken}&rid=${roomId}`);
		if (room?.room?.v?.token === visitorToken) {
			setVisitorId(room.room.v._id);
			setVisitorName(room.room.fname);
			room?.room?.responseBy?.username
				? setAgentName(room.room.responseBy.username)
				: setAgentName(room.room.servedBy.username);
			setStatus(room?.room?.callStatus || 'ended');
			return setIsRoomMember(true);
		}
	}, [visitorToken, roomId]);

	const setupCallForAgent = useCallback(async () => {
		const room = await APIClient.v1.get(`/rooms.info?roomId=${roomId}`);
		console.log('hey', room);
		setVisitorName(room.room.fname);
		room?.room?.responseBy?.username
			? setAgentName(room.room.responseBy.username)
			: setAgentName(room.room.servedBy.username);
		if (room?.room?.servedBy?._id === Meteor.userId()) {
			setStatus(room?.room?.callStatus || 'ended');
			return setIsRoomMember(true);
		}
	}, [roomId]);

	useEffect(() => {
		if (visitorToken) {
			return setupCallForVisitor();
		}
		setupCallForAgent();
	}, [setupCallForAgent, setupCallForVisitor, visitorToken]);
	if (status === null) {
		return <PageLoading></PageLoading>;
	}
	if (!isRoomMember) {
		return <NotFoundPage></NotFoundPage>;
	}
	const closeCallTab = () => {
		window.close();
	};
	if (status === 'ended') {
		return (
			<Flex.Container direction='column' justifyContent='center'>
				<Box
					width='full'
					minHeight='sh'
					textAlign='center'
					backgroundColor='neutral-900'
					overflow='hidden'
					position='relative'
					backgroundColor='#181B20'
				>
					<Box
						position='absolute'
						zIndex='1'
						style={{
							top: '5%',
							right: '2%',
						}}
						w='x200'
						border='1px solid black'
						padding='30px'
						backgroundColor='#2F343D'
					>
						<UserAvatar username={agentName} className='rcx-message__avatar' size='x32' />
					</Box>
					<Box position='absolute' zIndex='1' style={{ top: '20%', right: '45%' }}>
						<UserAvatar username={visitorName} className='rcx-message__avatar' size='x124' />
						<p style={{ color: 'white', fontSize: 15, textAlign: 'center', margin: 15 }}>
							{'Call Ended'}
						</p>
						<p style={{ color: 'white', fontSize: 35, textAlign: 'center', margin: 15 }}>
							{visitorName}
						</p>
					</Box>
					<Box position='absolute' zIndex='1' style={{ top: '80%', right: '48%' }}>
						<Button
							title='Close Window'
							onClick={closeCallTab}
							backgroundColor='#2F343D'
							borderColor='#2F343D'
						>
							<Icon name='cross' size='x16' color='white' />
						</Button>
					</Box>
				</Box>
			</Flex.Container>
		);
	}
	return (
		<CallPage
			roomId={roomId}
			status={status}
			visitorToken={visitorToken}
			visitorId={visitorId}
			setStatus={setStatus}
			visitorName={visitorName}
			agentName={agentName}
		></CallPage>
	);
}

export default MeetPage;
