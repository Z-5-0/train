export interface LocationApiResponse {
    address: LocationAddress;
    addresstype?: string;
    boundingbox: string[];
    class: string;
    display_name: string;
    importance?: number;
    lat: string;
    licence: string;
    lon: string;
    name?: string;
    osm_id: number;
    osm_type: string;
    place_id: number;
    place_rank?: number;
    type: string;
}

interface LocationAddress {
    'ISO3166-2-lvl6'?: string;
    'ISO3166-2-lvl8'?: string;
    borough?: string;
    city?: string;
    country?: string;
    country_code?: string;
    house_number?: string;
    neighbourhood?: string;
    postcode?: string;
    region?: string;
    road?: string;
    suburb?: string;
}