---
title: "Definition of Done Template"
date: 2023-04-24T23:42:14+08:00
draft: false
categories: ['职场']
tags: ['agile']
show_comments: true
slug: definition-of-done-template
---

I built the Dod for my team.

## code quality



- [ ] Whether the code has passed codereview, and all comments have been resolved; the ticket has been implemented correctly



- [ ] Whether the code complies with the team coding standards, clean and easy to understand



- [ ] Are all non-functional requirements met: performance, reliability

## APIs



- [ ] Whether the API modification is backward compatible



- [ ] Whether the API broken change has been widely notified to other teams



- [ ] **Whether Avro schema registry to Gamma and Prod**



- [ ] **Whether the newly added Event stream field/database column has been backfilled**



- [ ] Does the API modification need to update the API test suite at the same time, and the test passes?



- [ ] Does the new API need to have a corresponding automated API test, and the test passes

## testing/monitoring



- [ ] Whether all modified code has unit tests, and the tests pass.



- [ ] Whether to run in the local development environment and pass the self-test



- [ ] Was it successfully deployed to Gamma



- [ ] Whether it is verified and passed in the Gamma environment



- [ ] Whether it was successfully deployed to Prod



- [ ] Whether it is verified and passed in the Prod environment



- [ ] Is there an integration test (kronos test and atlas test), and the test passes



- [ ] Is there a Syntetic Test (UI Test), and the test passed



- [ ] Whether to give feedback to stakeholders/support reporter function is online and accepted



- [ ] **Whether the function establishes the corresponding metric and monitor, alter configuration, and pass the verification**



- [ ] Whether to complete manual regression testing

## document



- [ ] Whether all relevant documents (technical documents, runbook, wiki) are updated, perfect and consistent with the code: confluence, G Suit, Readme



- [ ] Whether all extended unfinished items are recorded in jira



- [ ] Whether the status of Jira is updated, and all comments have been replied
