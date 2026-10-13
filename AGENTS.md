## Dashboard architecture

- Keep the Ladywood experience as a client-state analytical workspace with selectable views on the index route, because map selection and weighting must remain consistent across analysis views.
- Keep scoring and screening data in browser-safe pure modules and lazy-load the Leaflet map, because Leaflet requires the browser while scoring must be testable independently.
- Treat source coverage and validation as explicit evidence records, separate from illustrative screening inputs, because a prototype must not imply measured or authoritative environmental data.
