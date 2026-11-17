import { Link } from "react-router-dom";
import "./BrandLogo.css";

function BrandLogo({ to, className = "", compact = false }) {
    const classes = [
        "brand-logo",
        compact ? "brand-logo--compact" : "",
        className,
    ]
        .filter(Boolean)
        .join(" ");

    const contents = (
        <>
            <span className="brand-logo__mark" aria-hidden="true">
                <img src="/images/logo/symbol-color.svg" alt="" />
            </span>
            <span className="brand-logo__wordmark">
                <strong>GEOGUESS</strong>
                <small>ANGOLA</small>
            </span>
        </>
    );

    return to ? (
        <Link className={classes} to={to} aria-label="GeoGuess Angola">
            {contents}
        </Link>
    ) : (
        <span className={classes}>{contents}</span>
    );
}

export default BrandLogo;
