import React from 'react';
import { createRoot } from 'react-dom/client';
import { PluginLayoutControlsDisplay } from 'molstar/lib/mol-plugin/layout';
import { DefaultPluginUISpec, PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { Plugin } from 'molstar/lib/mol-plugin-ui/plugin';
import { MolScriptBuilder } from 'molstar/lib/mol-script/language/builder';
import { Color } from 'molstar/lib/mol-util/color';


export async function initViewer(element: string | HTMLDivElement, options?: { spec?: PluginUISpec }) {
    try{
        console.log("Mol* viewer with React UI controls for GlycamWeb.");
        const parent = typeof element === 'string' ? document.getElementById(element)! as HTMLDivElement : element;
        const defaultSpec = DefaultPluginUISpec();
        const spec : PluginUISpec = {
            behaviors: defaultSpec.behaviors,
            config: [
                [PluginConfig.Structure.SaccharideCompIdMapType, 'glycam']
            ],
            layout: {
                initial: {
                    isExpanded: false,
                    showControls: false,
                    controlsDisplay: 'landscape' as PluginLayoutControlsDisplay,
                },
            },
        };
        const plugin = new PluginUIContext(spec);
        await plugin.init();
        createRoot(parent).render(<Plugin plugin={plugin} />)
        return plugin;
    }
    catch(error){
        console.error("Failed to load the structure into Glycam-MolStar:", error);
        const ERRORS = document.querySelector("#errors") as HTMLDivElement;
        if(ERRORS){
            ERRORS.style.display = "block";
        }
        const COUNT = document.querySelector("#error_count") as HTMLSpanElement;
        if (COUNT){
            COUNT.innerHTML = "1";
        }

        const BODY = document.querySelector("#error_card_body") as HTMLDivElement;
        if (BODY){
            BODY.innerHTML = error.toString();
        }
    };
}

export async function loadStructure(
    plugin: PluginUIContext,
    url: string,
    options?: { format?: string, isBinary?: boolean }
) {
    try{
        console.log(`gp_viewer_ui.loadStructure was called with url: ${url}`);
        console.log(`   and options: ${JSON.stringify(options)}`);

        const data = await plugin.builders.data.download(
            { url, isBinary: options?.isBinary }
        );

        const trajectory = await plugin.builders.structure.parseTrajectory(
            data,
            options?.format ?? "pdb" as any
        );

        const model = await plugin.builders.structure.createModel(trajectory);
        // The co-complex is the structure.
        const structure = await plugin.builders.structure.createStructure(model);

        // The co-complex is made up of components, which are the protein and any carbohydrates.
        // In the Mol* context, 'polymer' means the protein.
        const protein = await plugin.builders.structure.tryCreateComponentStatic(structure, 'polymer');
        if (protein?.isOk){
            // Add a representation for the protein.
            await plugin.builders.structure.representation.addRepresentation(structure, {
                type: 'cartoon',
                typeParams: { 
                    alpha: 1.0,
                }
            });
        }

        // Use a query to define the glycans as any components that are not polymers.
        const MS = MolScriptBuilder
        const query =  MS.struct.generator.atomGroups({
            'entity-test': MS.core.rel.neq([MS.ammp('entityType'), 'polymer'])
        });
        const glycans = await plugin.builders.structure.tryCreateComponentFromExpression(structure, query, 'not-polymer');

        if (glycans?.isOk){
            // Add a representation for the glycans.
            await plugin.builders.structure.representation.addRepresentation(glycans, {
                // line/ball-and-stick
                type: 'ball-and-stick',
                typeParams: { 
                    alpha: 1.0,
                }
            });

            // In the CB context, 'carbohydrate-terminal-link' connects from the aglycon to the 3dSNFG symbol of 
            // the reducing end sugar. But that looks like an error, so we comment it out. (GP uses this to fix a gap.)
            await plugin.builders.structure.representation.addRepresentation(structure, {
                type: 'carbohydrate',
                typeParams: {
                    alpha: 1.0,
                    sizeFactor: 0.8,
                    linkSizeFactor: 0.0,
                    visuals: [
                        'carbohydrate-symbol', 
                        'carbohydrate-link',
                        'carbohydrate-terminal-link'
                    ]
                }
            });
        }

        // Filling the gap between the protein and glycans.
        // OLS, OLT, or NLN
        const gap_query = MS.struct.generator.atomGroups({
            'residue-test': MS.core.logic.or([
                MS.core.rel.eq([MS.ammp('label_comp_id'), 'OLS']),
                MS.core.rel.eq([MS.ammp('label_comp_id'), 'OLT']),
                MS.core.rel.eq([MS.ammp('label_comp_id'), 'NLN'])
            ])
        });
        const gap = await plugin.builders.structure.tryCreateComponentFromExpression(structure, gap_query, 'gap');

        if (gap?.isOk){
            // Add a representation for the gap.
            await plugin.builders.structure.representation.addRepresentation(gap, {
                // line/ball-and-stick
                type: 'ball-and-stick',
                typeParams: { 
                    alpha: 1.0,
                }
            });
        }
    }
    catch(error){
        if (error instanceof Response && error.status === 404){
            console.error("404, not found.");
            const div = document.querySelector("#glycam_molstar_viewer");
            if (div){
                div.innerHTML = error.statusText;
            }
        }
        else{
            console.error('Error loading structure.', error);
        }
    }
}