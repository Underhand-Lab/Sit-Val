import React from 'react';

const LeadoffVisualizer = ({ data }) => {
  if (!data || !data[0]) return null;
  const ret = data[0];

  return (
    <div className="result-leadoff">
      <table className="leadoff-table">
        <thead>
          <tr>
            <th>타순</th>
            <th>시작 확률</th>
            <th>시작 횟수</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 9 }).map((_, i) => (
            <tr key={i}>
              <td>
                {i + 1}번 타자
              </td>
              <td>
                {((ret['leadoff_vector'][i] / 9) * 100).toFixed(2)}%
              </td>
              <td>
                {ret['leadoff_vector'][i].toFixed(3)}
                회
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeadoffVisualizer;