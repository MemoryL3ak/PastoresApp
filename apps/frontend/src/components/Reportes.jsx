export default function Reportes() {
  return (
    <div>
      <h2 className="view-title">Reportes</h2>

      <div className="panel">
        <h3>Asistencia por evento</h3>
        <div className="filters-row">
          <select className="field-input">
            <option>Conferencia</option>
          </select>
          <button className="btn-secondary">Exportar a Excel</button>
        </div>

        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Día</th>
                <th>Sesión</th>
                <th>Asistentes</th>
                <th>No acreditados</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>20/11/2025</td>
                <td>AM</td>
                <td>230</td>
                <td>5</td>
              </tr>
              <tr>
                <td>20/11/2025</td>
                <td>PM</td>
                <td>260</td>
                <td>3</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
