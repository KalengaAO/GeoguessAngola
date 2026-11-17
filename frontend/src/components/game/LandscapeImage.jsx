/** Imagem da paisagem + título da ronda. */
function LandscapeImage({
    imageUrl,
    title = "Onde fica este lugar?",
    description = "Observa a paisagem e identifica a sua localização no mapa de Angola.",
}) {
    return (
        <div className="game-page__landscape">
            <div className="game-page__section-heading">
                <h1>{title}</h1>
                <p>{description}</p>
            </div>

            <div className="game-page__image-container">
                <img
                    src={imageUrl}
                    alt="Paisagem angolana para identificação geográfica"
                    className="game-page__image"
                />
            </div>
        </div>
    );
}

export default LandscapeImage;
