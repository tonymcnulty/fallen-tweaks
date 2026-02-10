import "./styles/fallen-tweaks.css";
import { moduleManager } from "./module-manager";
import { bazaarTotal } from "./modules/bazaar-total";
import { cardFavourites } from "./modules/card-favourites";
import { qualityFavourites } from "./modules/quality-favourites";

/** Register all feature modules. */
moduleManager.register(bazaarTotal);
moduleManager.register(cardFavourites);
moduleManager.register(qualityFavourites);

/** Initialize — reads storage state and enables active modules. */
moduleManager.initialize();
