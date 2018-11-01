import { Component, OnInit } from '@angular/core';
import { AmplifyService } from 'aws-amplify-angular';

@Component({
  selector: 'app-mngt-units',
  templateUrl: './mngt-units.component.html',
  styleUrls: ['./mngt-units.component.scss']
})
export class MngtUnitsComponent implements OnInit {

private dataTable: any;
private session: any;
apiName = 'gorico';
path = '/management-units'; 
myInit = { // OPTIONAL
    headers: {
    }, // OPTIONAL
    response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
    queryStringParameters: {  // OPTIONAL
       codice_part: 'DEMO'
    }
};


  constructor(
      private amplifyService: AmplifyService
  ) { 
      this.amplifyService = amplifyService;
  }

  ngOnInit(): void {

    this.amplifyService.auth();

    this.dataTable = this.amplifyService.api().get(this.apiName, this.path, this.myInit)
        .then(response => {
            console.log(response);
    }).catch(error => {
        console.log(error.response);
    });


  }

}
