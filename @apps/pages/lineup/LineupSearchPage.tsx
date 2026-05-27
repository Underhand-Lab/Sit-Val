import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@shared/bridges/UIBridge';
import { db } from '../../services/db';
import { DataManagementView } from '../../common/components/DataManagementView';

const LineupSearchPage: React.FC = () => {
	const navigate = useNavigate();
	return (
		<DataManagementView
			title="라인업"
			items={db.getData('yearlyLineups')}
			createPath="/lineup/new"
			renderItem={(l) => <Button onClick={() => navigate(`/lineup/${l.id}`)}>{l.name} ({l.year})</Button>}
		/>
	);
};
export default LineupSearchPage;