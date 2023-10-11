import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../api.service';
import AdyenCheckout from '@adyen/adyen-web';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent implements OnInit {
  @ViewChild('hook', { static: true }) hook: ElementRef;
  type: string = '';
  sessionId: string = '';
  redirectResult: string = '';
  clientKey: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private http: HttpClient
  ) {
    this.hook = new ElementRef('');
  }

  handleServerResponse(res: any, component: any) {
    if (res.action != null) {
      component.handleAction(res.action);
    } else {
      switch (res.resultCode) {
        case 'Authorised':
          this.router.navigate(['/result/success']);
          break;
        case 'Pending':
        case 'Received':
          this.router.navigate(['/result/pending']);
          break;
        case 'Refused':
          this.router.navigate(['/result/failed']);
          break;
        default:
          this.router.navigate(['/result/error']);
          break;
      }
    }
  }

  ngOnInit(): void {
    this.type = this.route.snapshot.queryParamMap.get('type') || '';
    this.sessionId = this.route.snapshot.queryParamMap.get('sessionId') || '';
    this.redirectResult = this.route.snapshot.queryParamMap.get('redirectResult') || '';

    // obtain ADYEN_CLIENT_KEY
    this.http
      .get<any>('/api/config', {observe: 'response'})
      .subscribe(resp => {
        this.clientKey = resp.body.api_key;
    });


    if (!this.sessionId) {

      this.apiService.sessions().subscribe(
        (async res => {

            // Create AdyenCheckout using Sessions response
            const checkout = await this.createAdyenCheckout(res)

            await checkout.create(this.type).mount(this.hook.nativeElement);
        }),
        (async error => {
          console.log('Error is: ', error);
        })
      );
    }
    else {
      // existing session: complete Checkout
      this.finalizeCheckout();
    }

  }

  async createAdyenCheckout ( session: object )
  {
    //session es el objeto session entero
    const session2 = {
      id: 'CS5A4BE259FC589D9B',
      sessionData: 'Ab02b4c0!BQABAgCmfREpc5L5A0u73LaoRm9AN3GFYyi7RLFQdX2c0MhI9Ywt4C0vuf+Gxu5yNXCvcwNcL+qbCB8djIMFZrgtePFgO1hcNcw/b8WuYlcM07iESGcD9hEBtOGHso4GkLzKB5BvkBYJIgaKF4S5iQEEZp+8YP52bSF4u8sYeVCh32QgfLuTq3hnmMs+sSttTjbtAy+kyj0Hn7teUcwHyOhgu0RgLgOSWP07MFf32nRHuAKqQeiIFadoMcUOvYn1/qYMJav/k8M4zlp/PBiSmRGvxN8CUGyV88BOJoIwSriFqMDUQ5GhVqzxESaaFKOD5wMQdp4YeJzpOA2iZi3ODeKEHvd3AeHo7/5BdSzQZRYkI1Y33vcs1JRHnSZXZFyYSiEhas/2ZZs9SfIDgPSjorQyqnlT0f9HL9SogZvx6ZVxOmPZ+NSLVaBKCHbrGBXsPefvztRydVqchlzaC9I4DNOlbGs+J2y7yszpUMLMkVpc3HD7nON7gL5q1xRxoZuvipsgIpJrKgfJPtMdVJhvn9aGxMBcdnWHg6ABWsOF8kN06vjv6U/fr0+WsbITD+34kzC/VbAaQXvw4HHDFptpYymWyyLkaiSRaD5i8cQWRvgsbg8Ycco5IAPdeuZc265d+NGZajF+JtoNPmi8MEoSCYyi4zpHxzO1GP++oLtfxtaO5qpFYwxe7WL4bc6TKzfdk2MASnsia2V5IjoiQUYwQUFBMTAzQ0E1MzdFQUVEODdDMjRERDUzOTA5QjgwQTc4QTkyM0UzODIzRDY4REFDQzk0QjlGRjgzMDVEQyJ99f7oGSRXn/rdcAYD2NEjFVqAcQKCnuiH1kAWHMVosiDOgf0UJ5lB6zJ4EbwDhj4PYBQQyTe50whgxgb00vxSN7hm5NmkCMC7vTyssD7N+yds5o9UXCYezDv1swK0ZqikX9AkxKPaers/V6CXKJNa3VQ2Z57UGwdgQMODRJWu89TPos0njmlcsnQLrEG9WWXQ3YeN0GbDmNvyklb93zk0UkxdFTmbdYDfzDbVAHoMGnXP8aihPUWmtYeiBKF1PDGMkbwGMM8p/xGJbySlmpmdXVmKBgrUjfivoaGSQj7wt8B6yTFFXwhSIzCbZOwWZzHCkR876S1qIkH8sLYI5sYEDmRhc4A3ysRE1eei7tiWKI8X5ylrq+JnRRZKJ1w+VmipVUSC/pBcSyVT9UUzGZsQIgFOoX9iekekq4cmm95VcAfG6qaI3LMRpyRAGKXIuw8ePMMvCbYbLD7NrPgBdiLc9mXTd+dIYOgLMMMxibe313FksnbniLyfbUfY/3bmg9fSHXnpHAR1EA0PJiL2WoygammfoMuQm7R2dLQL52oCTJe76qWHlsk3hbdTemonD8ZDG/HK9YDgCivUDyCP0HWREiLuU/7aD/HYsJHGPBu/NX3PFR8BvreW8T7IX2IELltnvnuIrqHEYRarKDbmDJ7vgTjxjVO0vQ=='
    }
    console.log( "my custom session", session2 );

    const configuration = {
      clientKey: this.clientKey,
      locale: "en_US",
      environment: "test",  // change to live for production
      showPayButton: true,
      session: session2,
      paymentMethodsConfiguration: {
        ideal: {
          showImage: true
        },
        card: {
          hasHolderName: true,
          holderNameRequired: true,
          name: "Credit or debit card",
        },
        paypal: {
          environment: "test",
          countryCode: "US"   // Only needed for test. This will be automatically retrieved when you are in production.
        }
      },
      onPaymentCompleted: ( state: any, component: any ) =>
      {
        this.handleServerResponse( state, component );
      },
      onError: ( error: any, component: any ) =>
      {
        console.error( error.name, error.message, error.stack, component );
      }
      };

      return await AdyenCheckout(configuration);
  }

  // Some payment methods use redirects. This is where we finalize the operation
  async finalizeCheckout() {
    try {
        // Create AdyenCheckout re-using existing Session
        const checkout = await this.createAdyenCheckout({id: this.sessionId});

        // Submit the extracted redirectResult (to trigger onPaymentCompleted() handler)
        checkout.submitDetails({details: this.redirectResult});
    } catch (error) {
        console.error(error);
        alert("Error occurred. Look at console for details");
    }
  }

}
