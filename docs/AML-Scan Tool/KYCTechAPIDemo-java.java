package io.regulat.kyctech;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.apache.http.HttpEntity;
import org.apache.http.NameValuePair;
import org.apache.http.auth.AuthenticationException;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.auth.BasicScheme;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.message.BasicNameValuePair;
import org.apache.http.util.EntityUtils;

public class KYCTechAPIDemo {

       public static void main(String[] args) throws IOException, AuthenticationException {

             HttpPost request = new HttpPost(https://app.regulat.io/api/auth/token);

             CloseableHttpClient httpClient = HttpClients.createDefault();

             request.addHeader(new BasicScheme().authenticate(new UsernamePasswordCredentials("your API username", "you API password"), request, null));

             List<NameValuePair> params = new ArrayList<NameValuePair>();
             params.add(new BasicNameValuePair("grant_type", "client_credentials"));
             request.setEntity(new UrlEncodedFormEntity(params));

             CloseableHttpResponse response = httpClient.execute(request);

             System.out.println("Status       : " + response.getStatusLine().getStatusCode() + "\n");

             HttpEntity entity = response.getEntity();

             if (entity != null) {
                    String responseAsString = EntityUtils.toString(entity);
                    System.out.println("Response     : " + responseAsString + "\n");
                    String token = responseAsString.split("\"")[3];

                    doScan(token);
             }

       }

       private static void doScan(String token) throws IOException {

             CloseableHttpClient client = HttpClients.createDefault();

             HttpPost httpPost = new HttpPost(https://app.regulat.io/api/kyc/v1/person);

             httpPost.setHeader("Authorization", "Bearer " + token);
             httpPost.setHeader("Accept", "application/json");
             httpPost.setHeader("Content-type", "application/json");

             String json = "{ \"firstname\" : \"Xavier\", \"lastname\" : \"Bettel\", \"yob\" : \"1973\", \"responseType\" : \"json\" }";
             StringEntity entity = new StringEntity(json);
             httpPost.setEntity(entity);

             CloseableHttpResponse response = client.execute(httpPost);
             HttpEntity responseEntity = response.getEntity();

             System.out.println("Scan result  : " + EntityUtils.toString(responseEntity));

             client.close();
       }

}
