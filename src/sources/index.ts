import { openMeteo } from "./open-meteo";
import { openWeatherMap } from "./openweathermap";
import type { WeatherSource } from "./types";
import { weatherApi } from "./weatherapi";

/** Para adicionar uma fonte: implemente WeatherSource e inclua aqui. */
export const SOURCES: WeatherSource[] = [openMeteo, weatherApi, openWeatherMap];
