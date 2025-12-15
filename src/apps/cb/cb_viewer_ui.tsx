import React from 'react';
import { createRoot } from 'react-dom/client';
import { PluginLayoutControlsDisplay } from 'molstar/lib/mol-plugin/layout';
import { DefaultPluginUISpec, PluginUISpec } from 'molstar/lib/mol-plugin-ui/spec';
import { PluginConfig } from 'molstar/lib/mol-plugin/config';
import { PluginUIContext } from 'molstar/lib/mol-plugin-ui/context';
import { Plugin } from 'molstar/lib/mol-plugin-ui/plugin';

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
            }
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
        console.log(`glycam_molstar.js is loading structure: ${url}`);
        console.log(`   with options: ${JSON.stringify(options)}`);

        const data = await plugin.builders.data.download(
            { url, isBinary: options?.isBinary }
        );

        const trajectory = await plugin.builders.structure.parseTrajectory(
            data,
            options?.format ?? "pdb" as any
        );

        const model = await plugin.builders.structure.createModel(trajectory);
        const structure = await plugin.builders.structure.createStructure(model, { name: "model", params: {} });
        // CB enjoys the simplicity of knowing that the structure is only a glycan.
        // To get both the ball and stick and 3dSNFG, we can add two representations to that same structure.
        await plugin.builders.structure.representation.addRepresentation(structure, {
            type: "ball-and-stick",
            typeParams: {
                alpha: 1
            }
        });
        // In the CB context, 'carbohydrate-terminal-link' connects from the aglycon to the 3dSNFG symbol of 
        // the reducing end sugar. But that looks like an error, so we comment it out. (GP uses this to fix a gap.)
        await plugin.builders.structure.representation.addRepresentation(structure, {
            type: "carbohydrate",
            typeParams: {
                alpha: 1,
                sizeFactor: 0.8,
                linkSizeFactor: 0,
                visuals: [
                    "carbohydrate-symbol",
                    "carbohydrate-link"
                    // 'carbohydrate-terminal-link'
                ]
            }
        });
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