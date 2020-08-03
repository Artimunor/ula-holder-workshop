import { Injectable } from "@angular/core";
import { Storage } from "@ionic/storage";
import { LocalCryptUtils } from "crypt-util";
import { BrowserHttpService } from "universal-ledger-agent";
import {
  AddressHelper,
  VerifiableCredentialHelper,
  VpController,
} from "ula-vp-controller";
import {
  ChallengeRequestSigner,
  VerifiableCredentialSigner,
  VerifiablePresentationSigner,
  VerifiableCredentialGenerator,
  VerifiablePresentationGenerator,
} from "vp-toolkit";
import {
  AddressRepository,
  VcDataManagement,
  VerifiableCredentialRepository,
  VerifiableCredentialTransactionRepository,
} from "ula-vc-data-management";
import { EventHandler } from 'universal-ledger-agent'
import { ProcessEthBarcode } from 'ula-process-eth-barcode'

@Injectable()
export class UlaService {

  private eventHandler: EventHandler;

  constructor(private storage: Storage) {

    // Some repositories and plugins require a DataStorage, use the constructor param for that.
    //const privateMasterKey = "xprv9s21ZrQH143K2LLQ7KdTM8D8yAD54aGpcLwCt3gniTeKZbyPjvgwtCZeNErqSRWJMQJonB6C2qehSMsvt4JPD3amjZvfg9eNdEksXHhezHM";
    // Todo construct all plugin dependencies here
    // Todo construct all plugins here
    // Todo construct the ULA eventhandler with the plugins

    const privateMasterKey = "xprv9s21ZrQH143K4Hahxy3chUqrrHbCynU5CcnRg9xijCvCG4f3AJb1PgiaXpjik6pDnT1qRmf3V3rzn26UNMWDjfEpUKL4ouy6t5ZVa4GAJVG";
    const cryptUtil = new LocalCryptUtils();
    cryptUtil.importMasterPrivateKey(privateMasterKey);

    const crSigner = new ChallengeRequestSigner(cryptUtil);
    const vcSigner = new VerifiableCredentialSigner(cryptUtil);
    const vpSigner = new VerifiablePresentationSigner(cryptUtil, vcSigner);
    
    const vcGenerator = new VerifiableCredentialGenerator(vcSigner);
    const vpGenerator = new VerifiablePresentationGenerator(vpSigner);
    
    const browserHttpService = new BrowserHttpService();

    const addressHelper = new AddressHelper(cryptUtil);
    const verifiableCredentialHelper = new VerifiableCredentialHelper(
      vcGenerator,
      addressHelper
    );

    const accountId = 0;

    const vpControllerPlugin = new VpController(
      vpGenerator,
      [vpSigner],
      [crSigner],
      browserHttpService,
      verifiableCredentialHelper,
      addressHelper,
      accountId
    );

    const vcDataRepository = new VerifiableCredentialRepository(this.storage);
    const addressRepository = new AddressRepository(this.storage);
    const vcTxRepository = new VerifiableCredentialTransactionRepository(this.storage);

    const vcDataMgmtPlugin = new VcDataManagement(
      vcDataRepository,
      addressRepository,
      vcTxRepository
    );

    const processQrCodePlugin = new ProcessEthBarcode(browserHttpService);

    const plugins = [
      vcDataMgmtPlugin,
      vpControllerPlugin,
      processQrCodePlugin
    ];

    this.eventHandler = new EventHandler(plugins);
  }

  public async sendMessage(message: object, callback: any) {
    this.eventHandler.processMsg(message, callback)
  }
}
