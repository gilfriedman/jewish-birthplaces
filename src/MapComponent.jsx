import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const customIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconSize: [25, 41], // size of the icon
    iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
    popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    shadowSize: [41, 41], // size of the shadow
});

const MapComponent = () => {
    const [markers, setMarkers] = useState([]);

    useEffect(() => {
        const fetchWikidata = async () => {
            const query = `
        SELECT ?person ?personLabel ?birthPlace ?birthPlaceLabel ?coord WHERE {
          ?person wdt:P140 wd:Q9268;  # Judaism
                  wdt:P19 ?birthPlace.
          ?birthPlace wdt:P625 ?coord. # Coordinates
          SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
        }
        LIMIT 1000
      `;

            const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

            try {
                const response = await axios.get(url);
                const data = response.data.results.bindings;

                const newMarkers = data.map((item) => {
                    const coords = item.coord.value.replace('Point(', '').replace(')', '').split(' ');
                    return {
                        person: item.personLabel.value,
                        birthPlace: item.birthPlaceLabel.value,
                        lat: parseFloat(coords[1]),
                        lon: parseFloat(coords[0]),
                    };
                });

                setMarkers(newMarkers);
            } catch (error) {
                console.error('Error fetching data from Wikidata', error);
            }
        };

        fetchWikidata();
    }, []);

    return (
        <MapContainer center={[0, 0]} zoom={2} style={{ height: '100vh', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markers.map((marker, idx) => (
                <Marker key={idx} position={[marker.lat, marker.lon]} icon={customIcon} >
                    <Popup>
                        <strong>{marker.person}</strong><br/>
                        Birthplace: {marker.birthPlace}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;
