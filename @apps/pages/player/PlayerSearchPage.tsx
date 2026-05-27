import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@shared/bridges/UIBridge';
import { db } from '../../services/db';
import { DataManagementView } from '../../common/components/DataManagementView';

const PlayerSearchPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <DataManagementView 
      title="선수" 
      items={db.getData('yearlyPlayers')} 
      createPath="/player/new" 
      renderItem={(p) => <Button onClick={() => navigate(`/player/${p.id}`)}>{p.year} ID:{p.id}</Button>} 
    />
  );
};
export default PlayerSearchPage;