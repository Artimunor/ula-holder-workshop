import { Component } from '@angular/core';
import { QRScanner, QRScannerStatus } from '@ionic-native/qr-scanner/ngx';
import { UlaService } from '../../../service/ula.service';
import { ModalController } from "@ionic/angular";
import { Log } from '../../../util/log';
import { UlaResponse } from 'universal-ledger-agent';
import { ConsentPage } from '../consent/consent.page';

@Component({
  selector: 'app-scan-qr',
  templateUrl: 'scan-qr.page.html',
  styleUrls: ['scan-qr.page.scss']
})
export class ScanQrPage {

  constructor(private modalCtrl: ModalController, private qrScanner: QRScanner, private ulaService: UlaService) {}

  ionViewWillEnter() {
    this.qrScanner.prepare()
      .then((status: QRScannerStatus) => {
        if (status.authorized) {
          // camera permission was granted

          // start scanning
          const scanSub = this.qrScanner.scan().subscribe((text: any) => {
            // only the browser platform returns the payload inside the result property
            let payload = text.result ? JSON.parse(text.result) : JSON.parse(text)

            Log.info('ScanQrPage', 'qrScanner', 'Scanned', payload);

            this.ulaService.sendMessage(payload, async (result: UlaResponse) => {
              // If result.statusCode is 204 or 201, you've received credentials. Show 'succeeded' message
              if(result.statusCode == 204 || result.statusCode == 201) {
                Log.info('ScanQrPage', 'ulaService.sendMessage', 'succeeded');
              }

              // If statuscode is 200, ask for consent because the app needs to send credentials:
              if(result.statusCode == 200) {
                const modal = await this.modalCtrl.create({
                  component: ConsentPage,
                  componentProps: {
                    payload: result.body
                  }
                });

                modal.onDidDismiss().then(() => {
                  // Restart the camera
                });

                modal.present();
              }
            });

            this.qrScanner.hide(); // hide camera preview
            scanSub.unsubscribe(); // stop scanning
          });

        } else if (status.denied) {
          // camera permission was permanently denied, guide the user to the settings page
          this.qrScanner.openSettings();
        } else {
          // permission was denied, but not permanently. You can ask for permission again at a later time.
        }
      })
      .catch((e: any) => console.log('Error is', e));
  }

}
