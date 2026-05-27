import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@shared/bridges/UIBridge';
import { db } from '../../services/db';
import { DataManagementView } from '../../common/components/DataManagementView';

const LeagueSearchPage: React.FC = () => {
	const navigate = useNavigate();
	return (
		<DataManagementView
			title="리그"
			items={db.getYearlyLeagues('kbo')}
			createPath="/league/new"
			renderItem={(l) => <Button onClick={() => navigate(`/league/${l.id}`)}>{l.year} {l.leagueId}</Button>}
		/>
	);
};
export default LeagueSearchPage;