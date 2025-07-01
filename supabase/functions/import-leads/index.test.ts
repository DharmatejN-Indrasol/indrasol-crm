import { Rhum } from 'https://deno.land/x/rhum@v1.1.12/mod.ts';
import { stub } from 'https://deno.land/x/mock@v0.10.1/stub.ts';
import sinon from "https://deno.land/x/sinon@v.1.7.0/pkg/sinon.js";

import { handler } from "./index.ts";
import supabaseAdmin from "../_shared/supabaseAdmin.ts";

Rhum.testPlan('import-zoominfo-leads/index.ts', () => {
    Rhum.testSuite('handler', () => {
        Rhum.testCase('should import leads and upsert them', async () => {
            const request = new Request('http://localhost:8000/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jobTitle: 'Engineer' }),
            });

            const mockToken = 'fake-zoominfo-token';
            const mockLeads = [{ firstName: 'Test', lastName: 'Lead' }];

            const fetchStub = stub(globalThis, 'fetch', (url: string, _options: any) => {
                if (url.includes('authenticate')) {
                    return Promise.resolve(new Response(JSON.stringify({ accessToken: mockToken })));
                }
                if (url.includes('leads/search')) {
                    return Promise.resolve(new Response(JSON.stringify({ leads: mockLeads })));
                }
                return Promise.resolve(new Response('Default mock response'));
            });

            const upsertStub = sinon.stub().resolves({ error: null });
            const fromStub = sinon.stub().returns({ upsert: upsertStub });
            const supabaseAdminStub = { from: fromStub };
            
            const adminStub = stub(supabaseAdmin, 'getClient', () => supabaseAdminStub);

            const response = await handler(request);
            const data = await response.json();

            Rhum.asserts.assertEquals(response.status, 200);
            Rhum.asserts.assertEquals(data.leads[0].first_name, 'Test');
            Rhum.asserts.assertEquals(upsertStub.callCount, 1);
            Rhum.asserts.assertEquals(upsertStub.getCall(0).args[0][0].first_name, 'Test');

            fetchStub.restore();
            adminStub.restore();
        });
    });
});

Rhum.run(); 