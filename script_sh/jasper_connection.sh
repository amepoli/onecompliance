#!/bin/bash

ssh -i "/opt/keys/cdk-ec2-user.pem" -L 5433:occdkstackprod-2-auroraclusterfromsnapshotinstance-oko7ldaqyexf.caxbbckt9xen.eu-central-1.rds.amazonaws.com:5432 ec2-user@18.193.201.111