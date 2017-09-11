/**
 * Created by admin on 2017/9/7.
 */
var MapHandle = {
    map: undefined,
    panorama: undefined,
    panoramaService: undefined,
    panoramaLayer: undefined,
    panoramaMarker: undefined,
    panoramaData: undefined,
    hasDragging: false,
    hasPanorama: false,
    init: function (id) {
        var map = new BMap.Map(id);
        map.centerAndZoom('廊坊', 10);
        map.enableScrollWheelZoom();
        this.map = map;
    },

    getMap: function () {
        if (this.map) {
            return this.map;
        }
    },

    getGeoJson: function () {
        var t = this;
        fetch('./data/devdata.json').then(function (response) {
            return response.json();
        }).then(function (data) {
            data = typeof data === 'string' ? JSON.parse(data) : data;
            t.loadJsonGeo(data.datas)
        }).catch(function (e) {
            console.log("Oops, error");
        });
    },

    loadJsonGeo: function (data) {
        var t = this;
        for (var i = 0, length = data.length; i < length; i++) {
            var item = data[i];
            if (item.longitude && item.latitude) {
                var pt = new BMap.Point(item.longitude, item.latitude);
                var myIcon = new BMap.Icon('img/biaoshi.gif', new BMap.Size(100, 100));
                var marker2 = new BMap.Marker(pt, {icon: myIcon});  // 创建标注
                pt['attrs'] = item;
                marker2.attributes = item;
                this.map.addOverlay(marker2);
                marker2.addEventListener('click', this.markerClick.bind(this));
            }
        }
    },

    markerClick: function (e) {
        this.showInfoWindow(e.currentTarget.attributes);
    },

    centerPoint: function (type) {
        var pt = undefined;
        switch (type) {
            case 0:
                pt = new BMap.Point(116.68, 39.52);//安次区
                break;
            case 1:
                pt = new BMap.Point(116.40, 39.10);//霸州
                break;
            case 2:
                pt = new BMap.Point(116.72, 39.53);//广阳
                break;
            case 3:
                pt = new BMap.Point(116.30, 39.43);//固安县
                break;
            case 4:
                pt = new BMap.Point(116.60, 39.32);//永清县
                break;
            case 5:
                pt = new BMap.Point(117.00, 39.77);//香河县
                break;
            case 6:
                pt = new BMap.Point(117.07, 39.98);//三河市
                break;
            case 7:
                pt = new BMap.Point(116.47, 38.87);//文安县
                break;
            case 8:
                pt = new BMap.Point(116.98, 39.88);//大厂回族自治县
                break;
            case 9:
                pt = new BMap.Point(116.70, 39.52);//廊坊市
                break;
        }
        this.map.panTo(pt);
    },

    setMapType: function (type) {
        var mapType = undefined;
        switch (type) {
            case 0:
                mapType = BMAP_NORMAL_MAP;
                break;
            case 1:
                mapType = BMAP_SATELLITE_MAP;
                break;
            case 2:
                this.hasPanorama = true;
                this.map.addTileLayer(this.panoramaLayer);
                this.panoramaMarker.show();
                break;
        }
        if(mapType) {
            this.hasPanorama = false;
            this.map.removeTileLayer(this.panoramaLayer);
            this.map.setMapType(mapType);
            this.panoramaMarker.hide();
        }
    },

    showInfoWindow: function (data) {
        var res = this.getInfoWindow(data);
        var point = new BMap.Point(data.longitude, data.latitude);
        var searchInfoWindow = new BMapLib.SearchInfoWindow(this.map, res, {
            title: '',
            width: 240,
            height: 100,
            enableAutoPan: true,
            searchTypes: []
        });
        searchInfoWindow.addEventListener("close", function (e) {
        });
        searchInfoWindow.open(point);
    },

    getInfoWindow: function (data) {
        return '<table width=\'100%\' class="fitem">' +
            '<tr><th>姓名</th><td style=\'width:24px;text-align:center;\'>' + (data.Contacts || '无') + '</td></tr>' +
            '<tr><th>企业名称</th><td style=\'width:24px;text-align:center;\'>' + (data.InControl || '无') + '</td></tr>' +
            '<tr><th>联系电话</th><td style=\'width:24px;text-align:center;\'>' + (data.phone || '无') + '</td></tr>' +
            '<tr><th>规模</th><td style=\'width:24px;text-align:center;\'>' + (data.scale || '无') + '</td></tr></table>';
    },

    loadPanorama: function () {
        this.panoramaService = new BMap.PanoramaService();
        this.panoramaLayer = new BMap.PanoramaCoverageLayer();

        var markerIcon = new BMap.Icon("location.png", new BMap.Size(24, 28));
        markerIcon.setImageSize(new BMap.Size(24, 28));
        this.panoramaMarker = new BMap.Marker(new BMap.Point(0, 0));  // 创建标注
        this.panoramaMarker.setIcon(markerIcon);
        this.panoramaMarker.enableDragging();

        var lableContent = "<div class=\"marker-panel\"><img id=\"myImg\" src=\"noImg.png\"/><div id=\"myDesc\"></div></div>";

        var panoramaLabel = new BMap.Label(lableContent);
        panoramaLabel.setStyle({border:'none',backgroundColor:'none'});
        this.panoramaMarker.setLabel(panoramaLabel);

        this.map.addOverlay(this.panoramaMarker);
        this.panoramaMarker.hide();
        this.initEvent();
    },

    initEvent: function () {
        var t = this;
        this.map.addEventListener('mousemove', function (r) {
            if(!t.hasPanorama){
                return false;
            }
            if (!t.hasDragging) {
                var pt = new BMap.Point(r.point.lng, r.point.lat);

                t.panoramaMarker.setPosition(pt);
                t.panoramaMarker.setOffset(new BMap.Size(-55, -105));
                t.panoramaData = undefined;
                var p = t.panoramaMarker.getPosition();
                t.loadPointName(p.lng, p.lat);
            }
        });

        this.map.addEventListener('click', function (r) {
            if(!t.hasPanorama){
                return false;
            }
            var pt = new BMap.Point(r.point.lng, r.point.lat);
            t.panoramaMarker.setOffset(new BMap.Size(-55, -105));
            t.panoramaMarker.disableDragging();

            if (t.panoramaData) {
                t.hasDragging = true;
                var panorama = t.map.getPanorama();//获取实例对象
                panorama.setId(t.panoramaData.id);
                panorama.show();
            }
        });

        $('.pano_close').on('click',function(e){
            this.panoramaMarker.enableDragging();
            this.hasDragging = false;
            this.panoramaData = undefined;
        }.bind(this));
    },

    loadPointName: function (lng, lat) {
        var t = this;
        this.panoramaService.getPanoramaByLocation(new BMap.Point(lng, lat), function (data) {
            var panoramaInfo = "";
            if (data == null) {
                t.panoramaData = undefined;
                return;
            }
            t.panoramaData = data;
            panoramaInfo += '全景id为：' + data.id + '\n';
            panoramaInfo += '坐标为：' + data.position.lng + ':' + data.position.lat + '\n';
            t.getImg(data);
        });
    },

    getImg: function (data) {
        $("#myImg").attr('src', "http://api.map.baidu.com/panorama/v2?ak=FovGfLyaU2eYMMQaiq8jEKIU&width=120&height=100&location=" + data.position.lng + "," + data.position.lat + "&fov=180");
        $("#myDesc").html(data.description);
    }
};

(function () {
    MapHandle.init('map');
    if (MapHandle.getMap()) {
        MapHandle.getGeoJson();
        MapHandle.loadPanorama();
    }
})();