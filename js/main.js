$(document).ready(function () {

    var pointDraw;
    var vectorSource = new ol.source.Vector();
    var coordinates = $("#coordinates");
    var latitude = $("[name='latitude']");
    var longitude = $("[name='longitude']");
    var wkt = $("[name='wkt']");


    var view = new ol.View({
        center: [-6217890.205764902, -1910870.6048274133],
        zoom: 4,
        maxZoom: 18,
        minZoom: 2
    });

    var osm = new ol.layer.Tile({
        source: new ol.source.OSM(),
        visible: true,
        name: "osm"
    });

    var bingmaps = new ol.layer.Tile({
        source: new ol.source.BingMaps({
            key: 'Ak-dzM4wZjSqTlzveKz5u0d4IQ4bRzVI309GxmkgSVr1ewS6iPSr0v0KhA-CJlm30',
            imagerySet: 'AerialWithLabels'
        }),
        visible: false,
        name: 'bingmaps'
    });

    var esri = new ol.layer.Tile({
        source: new ol.source.XYZ({
            attributions: [
                new ol.Attribution({
                    html: 'Tiles &copy; <a href="http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer">ArcGIS</a>'
                })
            ],
            url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
        }),
        visible: false,
        name: 'esri'
    });

    var stamen = new ol.layer.Tile({
        layers: [
            new ol.layer.Tile({
                source: new ol.source.Stamen({
                    layer: 'watercolor'
                })
            }),
            new ol.layer.Tile({
                source: new ol.source.Stamen({
                    layer: 'terrain-labels'
                })
            })
        ],
        visible: false,
        name: 'stamen'
    });

    var map = new ol.Map({
        target: 'map',
        controls: ol.control.defaults().extend([
            new ol.control.ScaleLine(),
            new ol.control.ZoomSlider()
        ]),
        renderer: 'canvas',
        layers: [osm, bingmaps, esri, stamen],
        view: view
    });

    $('#enviar').click(function () {
        var lat = latitude.val();
        var long = longitude.val();

        if(long!='' && lat!=''){
            vectorSource.clear();
            vectorSource.addFeature(
                new ol.Feature({
                    geometry: new ol.geom.Point([parseFloat(long),parseFloat(lat)]).transform('EPSG:4326', 'EPSG:3857')
                })
            );

            wkt.val('POINT('+ long + ' ' + lat + ')');
            map.getView().fit(vectorSource.getExtent(), map.getSize());
        }
        return false;
    })

    $('#layers input[type=radio]').change(function () {
        var layer = $(this).val();

        map.getLayers().getArray().forEach(function (e) {
            var name = e.get('name');
            e.setVisible(name == layer);
        });
    });

    var geolocation = new ol.Geolocation({
        projection: view.getProjection(),
        tracking: true
    });

    var style = new ol.style.Style({
        image: new ol.style.Circle({
            radius: 7,
            stroke: new ol.style.Stroke({
                color: '#2980B9',
                width: 3
            }),
            fill: new ol.style.Fill({
                color: 'rgba(52, 152, 219, 0.3)'
            })
        })
    });

    $('#geolocation').click(function () {
        var position = geolocation.getPosition();

        var point = new ol.layer.Vector({
            source: new ol.source.Vector({
                features: [
                    new ol.Feature({
                        geometry: new ol.geom.Point(position),
                        text: 'Minha localização é <br>'
                    })
                ]
            }),
            style: style
        });

        map.addLayer(point);

        view.setCenter(position);
        view.setResolution(2.388657133911758);
        return false;

    });

    var element = $('#popup');

    var popup = new ol.Overlay({
        element: document.getElementById('popup'),
        stopEvent: false
    });

    map.addOverlay(popup);

    map.on('click', function (evt) {

        var feature = map.forEachFeatureAtPixel(evt.pixel,
            function (feature, layer) {
                return feature;
            });

        if (feature) {
            var coordinate = feature.getGeometry().getCoordinates();
            element.show();
            element.html(feature.get('text') + ol.coordinate.toStringHDMS(ol.proj.transform(coordinate, 'EPSG:3857', 'EPSG:4326')));
            popup.setPosition(coordinate);
        } else {
            element.hide();
        }
    });

    var vectorLayer = new ol.layer.Vector({
        source: vectorSource
    });
    map.addLayer(vectorLayer);

    $("#pan").click(function () {
        clearCustomInteractions();
        $(this).addClass('active');
        return false;
    });

    $("#drawPoint").click(function () {
        clearCustomInteractions();
        $(this).addClass('active');

        pointDraw = new ol.interaction.Draw({
            source: vectorSource,
            type: 'Point'
        });

        map.addInteraction(pointDraw);

        pointDraw.on('drawend', function (e) {
            var feature = e.feature;
            vectorSource.clear();
            vectorSource.addFeature(feature);
            var latLong = feature.getGeometry().getCoordinates();
            coordinates.text(ol.coordinate.toStringHDMS(ol.proj.transform(latLong, 'EPSG:3857', 'EPSG:4326')));
            generatePointWkt(feature);
        });

        return false;
    });

    $("#erasePoint").click(function () {
        clearCustomInteractions();
        $(this).addClass('active');
        vectorSource.clear();
        coordinates.empty();
        return false;
    });

    function generatePointWkt(e) {
        var coords = ol.proj.transform(e.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326');
        longitude.val(coords[0]);
        latitude.val(coords[1]);

        coords.length ? wkt.val(wkt.val('POINT('+ coords[0] + ' ' + coords[1] + ')')) : wkt.val('');

        return false;
    }

    function clearCustomInteractions() {
        $("#bar").find("p").removeClass('active');
        map.removeInteraction(pointDraw);
    }
});