import { Component, ViewChild, ElementRef } from '@angular/core';
import * as L from 'leaflet';
import { HttpClient } from '@angular/common/http';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { IonSlides, Platform } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  @ViewChild('map', { static: false }) mapContainer: ElementRef;
  @ViewChild('slides', { static: false }) slider: IonSlides;

  map: any;
  marker: L.Marker;
  segment = 0;
  searchKey: string;
  places = [];
  isMarkerSet: boolean = false;

  addressComponent: any;
  constructor(public http: HttpClient, private geolocation: Geolocation, private platform: Platform) { }
  ionViewWillEnter() {
    console.log(this.marker)
    this.loadMap();
  }
  segmentChanged(ev) {
    console.log('segment change', ev.target.value)
    this.slider.slideTo(ev.target.value)
  }
  slideChanged() {
    this.slider.getActiveIndex().then(index => {
      this.segment = index;
    });
    
  }
  search() {
    if (this.searchKey === '') {
      this.places = [];
    } else if (this.searchKey.length > 2) {
      let url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + this.searchKey;
      this.http.get(url).subscribe((data: any) => {
        console.log(data);
        this.places = data;
      })
    }
    
  }
  onClickPickAddress(lat, lng) {
    this.places = [];
    console.log('0') 

    this.setMarkertWithAnimation(lat,lng, false);
  }
  loadMap() {
    this.map = L.map('map').fitWorld();
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'contributor',
      maxZoom: 30
    }).addTo(this.map);
    // For Web
    this.map.locate({
      setView: true,
      maxZoom: 30
    }).on('locationfound', (e) => {
      console.log(e);
      if(!this.platform.is('cordova')){
        console.log('Platform is Web') 
        this.setMarkertWithAnimation(e.latitude, e.longitude, true);
      }
    })
    // For Mobile
    if(this.platform.is('cordova')){
      this.geolocation.getCurrentPosition().then((resp) => {
        console.log('Platform is android/ios')
        this.setMarkertWithAnimation(resp.coords.latitude, resp.coords.longitude, true)  
       }).catch((error) => {
         console.log('Error getting location', error);
       });
    }
    
     // Adding Map Click Event
    this.map.on('click', (e) => {
      console.log('Map Clicked')
      this.setMarkertWithAnimation(e.latlng.lat, e.latlng.lng, false);
    })
  }


  setMarkertWithAnimation(lat, lng, force: boolean) {
    
    if(!force) {
      if(this.marker !== undefined) {
        console.log('marker was already there so removing it...')
        console.log('before remove', this.marker)
        // this.map.removeLayer(this.marker);
        // this.marker = null;
        this.marker.remove();
        this.marker = L.marker([lat, lng]).on('click', () => {
          console.log('marker clicked');
           
        });
        this.map.addLayer(this.marker);
        console.log('after remove', this.marker)
        this.map.setView({lat, lng}, this.map.getZoom() ,{
          "animate": true,
          "pan": {
            "duration": 4
          }
        })
        this.http.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`).subscribe((data: any) => {
          console.log('Address Data',data)
          this.addressComponent = data.address
          this.searchKey = data.display_name;
        })

      }
    } else {
      this.marker = L.marker([lat, lng]).on('click', () => {
        console.log('marker clicked');
         
      });
      this.map.addLayer(this.marker);
      this.map.setView({lat, lng}, this.map.getZoom() ,{
        "animate": true,
        "pan": {
          "duration": 4
        }
      })
      this.http.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`).subscribe((data: any) => {
        console.log('Address Data',data)
        this.addressComponent = data.address
        this.searchKey = data.display_name;
      })
    }
    setTimeout(() => 
    { this.map.invalidateSize()}, 500 );

  }
}
