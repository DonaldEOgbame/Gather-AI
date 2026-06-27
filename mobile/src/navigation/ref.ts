import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParams } from "./types";

/** Global navigation ref so non-screen code (e.g. the OS share-intent intake)
 *  can navigate once the container is ready. */
export const navigationRef = createNavigationContainerRef<RootStackParams>();
