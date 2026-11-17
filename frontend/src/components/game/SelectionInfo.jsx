/** Mostra as coordenadas do palpite actual. */
function SelectionInfo({ location }) {
    if (!location) return null;

    return (
        <div className="game-page__selection">
            <span>Localização seleccionada</span>
            <p>Latitude: {location.latitude.toFixed(6)}</p>
            <p>Longitude: {location.longitude.toFixed(6)}</p>
        </div>
    );
}

export default SelectionInfo;
