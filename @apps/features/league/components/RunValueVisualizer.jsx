import { vars } from "@shared/bridges/UIBridge";

const RunValueVisualizer = ({ data }) => {
  if (!data || !data[0]?.runValue) return null;
  const runValueData = data[0].runValue;

  const labels = {
    "hr": "홈런",
    "3B": "3루타",
    "2B": "2루타",
    "1B": "1루타",
    "bb": "볼넷",
    "so": "삼진",
    "go": "땅볼",
    "fo": "플라이",
  };

  const sortedItems = Object.keys(runValueData)
    .map(key => ({ name: key, value: runValueData[key].value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="result-run-value">
      <h3 style={{ margin: '0 0 10px 0' }}>리그 타구 가치</h3>
      <table className="re-table">
        <thead>
          <tr>
            <th style={{backgroundColor: vars.background}}>타구</th>
            <th style={{backgroundColor: vars.background}}>가치</th>
          </tr>
        </thead>
        <tbody>
          {sortedItems.map(item => (
            <tr key={item.name}>
              <td className="runner-state">
                {labels[item.name]}
              </td>
              <td>{item.value.toFixed(3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RunValueVisualizer;